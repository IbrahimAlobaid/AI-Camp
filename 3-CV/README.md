# AI Camp - Session 3: Computer Vision

This repository contains the materials for the third AI Camp session, focused on core Computer Vision concepts and practical image-processing workflows.

## Overview

The session moves from classical image processing to modern deep learning for vision. It includes hands-on Jupyter notebooks, sample images, visual references, and a small day/night image classification dataset.

Main topics covered:

- Image representation, color spaces, and preprocessing
- Thresholding, filtering, Fourier transforms, and edge detection
- Feature extraction with corners, pyramids, SIFT, ORB, FAST, and HOG
- Convolutional Neural Networks with PyTorch
- Introductory object detection concepts, including YOLO and RCNN
- A practical object tracking project using YOLO-based detection and tracking

## Covered Project

During this session, the following project was covered as a practical application of computer vision concepts:

- [Smart Tracker](https://github.com/IbrahimAlobid2/smart-tracker): a real-time object tracking system built with Streamlit, YOLO-based detection, multi-object tracking, speed estimation, line-crossing detection, and Arabic interface support.

## Repository Structure

```text
.
+-- 1-image_Pre-process.ipynb
+-- 2_Filters_Edge_Detection.ipynb
+-- 3_Feature_Extraction.ipynb
+-- cnn_explained_pytorch.ipynb
+-- cnn.ipynb
+-- Dataset/
|   +-- day_night_images/
+-- images/
+-- pyproject.toml
+-- uv.lock
```

## Notebooks

| Notebook | Focus |
| --- | --- |
| `1-image_Pre-process.ipynb` | Image pixels, OpenCV loading, RGB/BGR conversion, color thresholding, and basic preprocessing |
| `2_Filters_Edge_Detection.ipynb` | Filters, Fourier transforms, high/low frequencies, Otsu thresholding, Laplacian, Sobel, gradient magnitude, and Canny edge detection |
| `3_Feature_Extraction.ipynb` | Harris corners, image pyramids, feature descriptors, SIFT, ORB, FAST, and HOG concepts |
| `cnn_explained_pytorch.ipynb` | CNN fundamentals, PyTorch model building, MNIST training, evaluation, and feature-map visualization |
| `cnn.ipynb` | Deep learning vision topics and object detection concepts such as YOLO and RCNN |

## Dataset

The `Dataset/day_night_images` folder contains a balanced day/night image dataset:

| Split | Day | Night | Total |
| --- | ---: | ---: | ---: |
| Training | 120 | 120 | 240 |
| Test | 80 | 80 | 160 |

## Setup

This project uses Python `>=3.13` and dependencies defined in `pyproject.toml`.

Install dependencies with `uv`:

```bash
uv sync
```

Start Jupyter Notebook:

```bash
uv run jupyter notebook
```

Then open the notebooks in order, starting with `1-image_Pre-process.ipynb`.

## Key Dependencies

- OpenCV
- NumPy
- Matplotlib
- Pandas
- scikit-image
- scikit-learn
- SciPy
- PyTorch
- TorchVision

## Recommended Flow

1. Start with image preprocessing to understand how images are represented and manipulated.
2. Move to filters and edge detection to learn how visual structure is extracted.
3. Study feature extraction methods used in traditional computer vision pipelines.
4. Review the Smart Tracker project as an applied example of detection and tracking.
5. Finish with CNNs and object detection concepts to connect classical methods with deep learning.
