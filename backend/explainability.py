import os
import numpy as np
import tensorflow as tf
from PIL import Image

def find_last_conv_layer(model):
    """
    Finds the last layer with 4D output shape that has 'conv' or 'relu' in its name.
    Preferred: 'out_relu'.
    """
    try:
        if model.get_layer("out_relu") is not None:
            return "out_relu"
    except ValueError:
        pass

    # Fallback: scan in reverse order
    for layer in reversed(model.layers):
        if hasattr(layer, "output_shape") and isinstance(layer.output_shape, tuple) and len(layer.output_shape) == 4:
            name_lower = layer.name.lower()
            if "conv" in name_lower or "relu" in name_lower or "bn" in name_lower:
                return layer.name
    
    for layer in reversed(model.layers):
        if hasattr(layer, "output_shape") and isinstance(layer.output_shape, tuple) and len(layer.output_shape) == 4:
            return layer.name
            
    raise ValueError("Could not locate a suitable convolutional/activation layer for Grad-CAM.")

def generate_gradcam(img_array, model, last_conv_layer_name, pred_index=None):
    """
    Generates a Grad-CAM heatmap array of shape (H, W) in range [0, 1] using Keras and TensorFlow.
    """
    last_conv_layer = model.get_layer(last_conv_layer_name)
    
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[last_conv_layer.output, model.output]
    )
    
    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]
        
    grads = tape.gradient(class_channel, last_conv_layer_output)
    
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    
    heatmap = tf.maximum(heatmap, 0.0)
    
    max_val = tf.reduce_max(heatmap)
    if max_val > 0:
        heatmap = heatmap / max_val
        
    return heatmap.numpy()

def custom_jet_colormap(gray):
    """
    Piecewise linear Jet colormap:
    0.0 -> Blue, 0.25 -> Cyan, 0.5 -> Green, 0.75 -> Yellow, 1.0 -> Red
    """
    r = np.zeros_like(gray)
    g = np.zeros_like(gray)
    b = np.zeros_like(gray)
    
    m1 = (gray <= 0.25)
    r[m1] = 0.0
    g[m1] = 4.0 * gray[m1]
    b[m1] = 1.0
    
    m2 = (gray > 0.25) & (gray <= 0.5)
    r[m2] = 0.0
    g[m2] = 1.0
    b[m2] = 2.0 - 4.0 * gray[m2]
    
    m3 = (gray > 0.5) & (gray <= 0.75)
    r[m3] = 4.0 * (gray[m3] - 0.5)
    g[m3] = 1.0
    b[m3] = 0.0
    
    m4 = (gray > 0.75)
    r[m4] = 1.0
    g[m4] = 4.0 - 4.0 * gray[m4]
    b[m4] = 0.0
    
    rgb = np.zeros((gray.shape[0], gray.shape[1], 3), dtype=np.uint8)
    rgb[..., 0] = (r * 255).astype(np.uint8)
    rgb[..., 1] = (g * 255).astype(np.uint8)
    rgb[..., 2] = (b * 255).astype(np.uint8)
    return rgb

def create_heatmap(heatmap_array):
    """
    Converts 2D float heatmap in [0, 1] to a PIL Image of shape (224, 224) using Jet colormap.
    """
    heatmap_uint8 = (heatmap_array * 255).astype(np.uint8)
    
    heatmap_img = Image.fromarray(heatmap_uint8)
    heatmap_img_resized = heatmap_img.resize((224, 224), resample=Image.BILINEAR)
    
    resized_array = np.array(heatmap_img_resized, dtype=np.float32) / 255.0
    heatmap_color_array = custom_jet_colormap(resized_array)
    
    return Image.fromarray(heatmap_color_array)

def overlay_heatmap(original_img_path, heatmap_img, alpha=0.5):
    """
    Overlays the heatmap image on top of the original image.
    Both images are blended together: output = original * (1 - alpha) + heatmap * alpha.
    """
    original_img = Image.open(original_img_path)
    if original_img.mode != "RGB":
        original_img = original_img.convert("RGB")
        
    original_img_resized = original_img.resize((224, 224), resample=Image.LANCZOS)
    
    blended_img = Image.blend(original_img_resized, heatmap_img, alpha=alpha)
    return blended_img

def save_gradcam_result(original_img_path, model, prediction_id, timestamp, pred_index):
    """
    Full pipeline to generate, overlay, and save Grad-CAM.
    Returns the relative path (e.g. 'uploads/gradcam/gradcam_125_20260604_154500.png').
    """
    img = Image.open(original_img_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    img_resized = img.resize((224, 224))
    
    img_array = np.array(img_resized, dtype=np.float32)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    
    last_conv_layer_name = find_last_conv_layer(model)
    heatmap_array = generate_gradcam(img_array, model, last_conv_layer_name, pred_index)
    heatmap_img = create_heatmap(heatmap_array)
    overlaid_img = overlay_heatmap(original_img_path, heatmap_img, alpha=0.5)
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    gradcam_dir = os.path.join(backend_dir, "uploads", "gradcam")
    os.makedirs(gradcam_dir, exist_ok=True)
    
    filename = f"gradcam_{prediction_id}_{timestamp}.png"
    save_path = os.path.join(gradcam_dir, filename)
    overlaid_img.save(save_path)
    
    return f"uploads/gradcam/{filename}"
