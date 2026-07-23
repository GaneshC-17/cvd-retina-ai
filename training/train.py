import os
import shutil
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

def build_transfer_learning_model():
    # Build base MobileNetV2 model
    base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
    base_model.trainable = False  # Freeze MobileNetV2 base weights

    # Add custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    predictions = Dense(2, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def train_model(epochs=5, batch_size=16):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    train_dir = os.path.join(project_root, "dataset", "processed", "train")
    val_dir = os.path.join(project_root, "dataset", "processed", "val")
    
    # Check if directories exist
    if not os.path.exists(train_dir) or not os.path.exists(val_dir):
        raise FileNotFoundError(
            f"Processed dataset directories not found. Please run preprocess.py first."
        )

    # Data Augmentation & Generators
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    val_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input
    )

    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True
    )

    val_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    print("Building MobileNetV2 Transfer Learning Model...")
    model = build_transfer_learning_model()
    model.summary()

    # Define callbacks for early stopping and check-pointing
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True,
        verbose=1
    )
    
    saved_models_dir = os.path.join(project_root, "saved_models")
    os.makedirs(saved_models_dir, exist_ok=True)
    model_path = os.path.join(saved_models_dir, "model.h5")
    
    model_checkpoint = ModelCheckpoint(
        model_path,
        monitor='val_loss',
        save_best_only=True,
        verbose=1
    )

    print(f"Starting training for {epochs} epochs...")
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=val_generator,
        callbacks=[early_stopping, model_checkpoint],
        verbose=1
    )

    # Save final model if checkpoint didn't save or for safety
    model.save(model_path)
    print(f"Model saved to {model_path}")

    # Copy to backend models directory
    backend_model_dir = os.path.join(project_root, "backend", "models")
    os.makedirs(backend_model_dir, exist_ok=True)
    backend_model_path = os.path.join(backend_model_dir, "model.h5")
    shutil.copy(model_path, backend_model_path)
    print(f"Model copied to backend at {backend_model_path}")
    
    return history

if __name__ == "__main__":
    train_model(epochs=5)
