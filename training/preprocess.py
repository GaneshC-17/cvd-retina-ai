import os
import shutil
import random
from PIL import Image
import kagglehub

def preprocess_and_split(src_dir, output_dir, split_ratio=(0.7, 0.15, 0.15)):
    """
    Cleans target directories, processes the raw retina images,
    and splits them into train, validation, and test folders.
    - Class '0_healthy' -> '0_healthy'
    - Class '1_cvd_risk' -> '1_cvd_risk'
    """
    class_mapping = {
        "0_healthy": "0_healthy",
        "1_cvd_risk": "1_cvd_risk"
    }
    
    splits = ["train", "val", "test"]
    
    # Clean output directories to avoid mixing with previous datasets
    if os.path.exists(output_dir):
        print(f"Cleaning existing processed directory at {output_dir}...")
        shutil.rmtree(output_dir)
        
    for split in splits:
        for target_class in class_mapping.values():
            os.makedirs(os.path.join(output_dir, split, target_class), exist_ok=True)
            
    # Process each class from source dataset
    for src_class, target_class in class_mapping.items():
        src_class_path = os.path.join(src_dir, src_class)
        if not os.path.exists(src_class_path):
            print(f"Source folder {src_class_path} not found!")
            continue
            
        files = [f for f in os.listdir(src_class_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        random.seed(42)  # For reproducible splits
        random.shuffle(files)
        
        n_total = len(files)
        n_train = int(n_total * split_ratio[0])
        n_val = int(n_total * split_ratio[1])
        
        train_files = files[:n_train]
        val_files = files[n_train:n_train+n_val]
        test_files = files[n_train+n_val:]
        
        file_splits = {
            "train": train_files,
            "val": val_files,
            "test": test_files
        }
        
        for split, split_files in file_splits.items():
            print(f"Preprocessing {len(split_files)} images for {split}/{target_class}...")
            for f in split_files:
                src_path = os.path.join(src_class_path, f)
                dest_path = os.path.join(output_dir, split, target_class, f)
                
                try:
                    # Open, convert to RGB, resize to 224x224, and save
                    with Image.open(src_path) as img:
                        img_rgb = img.convert("RGB")
                        img_resized = img_rgb.resize((224, 224))
                        img_resized.save(dest_path)
                except Exception as e:
                    print(f"Error processing image {src_path}: {e}")
                    
    print("Preprocessing and dataset splitting completed successfully.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    print("Downloading/locating Kaggle dataset 'animalbiometry/cvd-vs-noncvd-retinal-images-of-cattle'...")
    try:
        kaggle_path = kagglehub.dataset_download("animalbiometry/cvd-vs-noncvd-retinal-images-of-cattle")
        print("Path to downloaded dataset files:", kaggle_path)
        
        src_dataset_dir = os.path.join(kaggle_path, "retina_healthy_unhealthy")
        raw_dataset_dir = os.path.join(project_root, "dataset", "raw")
        processed_dataset_dir = os.path.join(project_root, "dataset", "processed")
        
        # Copy the raw images to our workspace raw directory so they update there as well!
        print("Copying raw images to local project workspace 'dataset/raw'...")
        class_mapping = {
            "0": "0_healthy",
            "1": "1_cvd_risk"
        }
        
        # Clean local raw directory first
        if os.path.exists(raw_dataset_dir):
            print(f"Cleaning existing local raw directory at {raw_dataset_dir}...")
            shutil.rmtree(raw_dataset_dir)
            
        for src_class, target_class in class_mapping.items():
            src_class_path = os.path.join(src_dataset_dir, src_class)
            target_class_path = os.path.join(raw_dataset_dir, target_class)
            
            if os.path.exists(src_class_path):
                print(f"Copying raw files for class {target_class}...")
                shutil.copytree(src_class_path, target_class_path)
                
        # Now preprocess and split using the local raw directory as the source!
        preprocess_and_split(raw_dataset_dir, processed_dataset_dir)
    except Exception as e:
        print(f"Failed to load or preprocess Kaggle dataset: {e}")
