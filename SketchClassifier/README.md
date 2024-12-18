
## Sketch Image Classification with EfficientNet-B0

We have used EfficientNet model for classifying children's drawings, with a focus on enabling future use in story-building applications. The EfficientNet architecture, known for its state-of-the-art performance in image classification, has been adapted to work with single-channel grayscale images. The model achieves approximately 70% accuracy on our children's drawing dataset, providing a strong foundation for generating meaningful and interactive stories based on children's artwork.

### Model Architecture

The EfficientNet-B0 model is pre-trained on ImageNet but modified for this task with the following key changes:

1. **Single-Channel Input**: 
   - The first convolutional layer of EfficientNet-B0 is adapted to accept single-channel grayscale images instead of three-channel RGB images.
   - We achieve this by averaging the weights of the original RGB channels, ensuring that the pre-trained weights still contribute to learning on grayscale images.

2. **Dropout Regularization**:
   - To improve generalization and reduce overfitting, dropout layers are added in two places:
     - After the first convolutional block, providing regularization early in the network.
     - Before the final fully connected layer in the classifier head.
   - The dropout rate is set to 0.5, ensuring a good balance between regularization and performance.

3. **Modified Classifier Head**:
   - The original fully connected layer is replaced with a new layer that matches the number of classes in the sketch dataset.
   - The classifier head includes an additional dropout layer before the final fully connected layer, further improving generalization.

![output](https://github.com/user-attachments/assets/e2af402b-4446-45e6-93d0-92c8b169fbe9)
