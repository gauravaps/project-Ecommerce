import Product from "../models/productModel.js";
import uploadonCloudinary from "../utils/cloudinary.js";

export const addProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, countInStock,rating } = req.body;

    let imageUrl;

    if (req.file) {
      const uploadResponse = await uploadonCloudinary(req.file.path, category);

      if (!uploadResponse) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      imageUrl = uploadResponse.secure_url;
    } else {
      imageUrl =
        "https://res.cloudinary.com/gauravkacloud/image/upload/v1731986753/photo_yrra2i.png";
    }

    const product = new Product({
      user: req.user._id, // from verifyToken
      name,
      image: imageUrl,
      brand,
      category,
      description,
      price,
      countInStock,
      rating
    });

    const createdProduct = await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: createdProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




