
# Feed Forward Neural Network from Scratch

## Overview
This project implements a fully customizable feed forward neural network from scratch, providing a foundation for deep learning understanding. The code supports dynamic neural network configurations, allowing for customization of hyperparameters like learning rate, number of layers, input/output units, and training epochs. Future updates will introduce further customizability, including activation function selection.

## Project Goal
The primary objective is to predict the survival of Titanic passengers based on available information, such as gender, age, and ticket class, using a deep neural network. The model achieved 91.84% accuracy on test data, using two hidden layers with optimized parameters.

## Dataset
The Titanic dataset consists of 1,309 records with 12 features, including:

- **PassengerId**: Unique ID
- **Pclass**: Ticket class
- **Name**: Passenger's name
- **Sex**: Gender
- **Age**: Age
- **SibSp**: Number of siblings/spouses aboard
- **Parch**: Number of parents/children aboard
- **Ticket**: Ticket number
- **Fare**: Ticket fare
- **Cabin**: Cabin number
- **Embarked**: Port of embarkation
- **Survived**: Survival status (target variable)

Non-essential fields (e.g., `PassengerId`, `Name`, `Ticket`, and `Cabin`) were removed to focus on relevant features for survival prediction.

## Network Architecture
After experimenting with multiple architectures, the final structure includes:

- **Input Units**: 9
- **Output Units**: 1
- **Hidden Layers**: 2
  - **Layer 1**: 150 neurons, ReLU activation
  - **Layer 2**: 50 neurons, ReLU activation
- **Output Layer**: 1 neuron, Sigmoid activation

## Data Preprocessing
- **Irrelevant Columns Removed**: `PassengerId`, `Name`, `Ticket`, `Cabin`
- **Missing Values**:
  - **Age**: Imputed with median value
  - **Embarked**: Imputed with most common port
- **Categorical Encoding**:
  - **Gender**: Encoded as 0 (Female), 1 (Male)
  - **Embarked**: One-hot encoded into three columns
- **Standardization**: Age, siblings/spouses, parents/children, and fare fields were scaled to a range between -1 and 1.

## Results
The final network configuration (2 hidden layers with 150 and 50 neurons, ReLU and Sigmoid activations) achieved 91.84% accuracy on the test dataset.

---

### Future Work
Enhancements planned include:
- More flexible selection of activation functions.
- Expanded network configuration options.

---

### Usage
Clone this repository and run the model with your choice of hyperparameters.
