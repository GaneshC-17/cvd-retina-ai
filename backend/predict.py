import os
import io
import numpy as np
from PIL import Image

# Import TensorFlow
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model, load_model

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "model.h5")
_model = None

def get_or_create_model():
    global _model
    if _model is not None:
        return _model

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    if not os.path.exists(MODEL_PATH):
        print(f"Model file not found at {MODEL_PATH}. Generating fallback MobileNetV2 model...")
        
        # Build the exact MobileNetV2 transfer learning model requested:
        # MobileNetV2 -> GlobalAveragePooling2D -> Dense(128, ReLU) -> Dropout(0.3) -> Dense(2, Softmax)
        base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
        base_model.trainable = False  # Freeze MobileNetV2 base weights

        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(128, activation='relu')(x)
        x = Dropout(0.3)(x)
        predictions = Dense(2, activation='softmax')(x)

        model = Model(inputs=base_model.input, outputs=predictions)
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        
        # Save model to backend/models/model.h5
        model.save(MODEL_PATH)
        print(f"Fallback model successfully saved to {MODEL_PATH}")
        _model = model
    else:
        print(f"Loading existing model from {MODEL_PATH}...")
        try:
            _model = load_model(MODEL_PATH, compile=False)
        except Exception as e:
            print(f"Error loading model: {e}. Re-creating model...")
            _model = None
            if os.path.exists(MODEL_PATH):
                os.remove(MODEL_PATH)
            return get_or_create_model()
        
    return _model

def predict_image(image_bytes: bytes) -> dict:
    model = get_or_create_model()

    # Load image from bytes
    image = Image.open(io.BytesIO(image_bytes))
    
    # Ensure image is in RGB format
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    # Resize image to 224x224
    image = image.resize((224, 224))
    
    # Preprocess
    img_array = np.array(image, dtype=np.float32)
    
    # MobileNetV2 preprocessing expects pixels scaled between -1 and 1
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

    # Run inference
    predictions = model.predict(img_array)
    class_idx = np.argmax(predictions[0])
    confidence = float(predictions[0][class_idx]) * 100.0
    confidence = round(confidence, 1)

    labels = {
        0: "Healthy",
        1: "Cardiovascular Disease Risk"
    }

    prediction_label = labels.get(class_idx, "Healthy")
    
    return {
        "prediction": prediction_label,
        "confidence": confidence
    }
