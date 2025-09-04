import Product from "../models/productModel.js";
import uploadonCloudinary from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";




// Add new Product
export const addProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, countInStock, rating } = req.body;

    let imageUrl;
    let imagePublicId;

    if (req.file) {
      const uploadResponse = await uploadonCloudinary(req.file.path, category);

      if (!uploadResponse) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      imageUrl = uploadResponse.secure_url;
      imagePublicId = uploadResponse.public_id; 
    } else {
      imageUrl =
        "https://res.cloudinary.com/gauravkacloud/image/upload/v1731986753/photo_yrra2i.png";
      imagePublicId = null; 
    }

    const product = new Product({
      user: req.user._id, 
      name,
      image: imageUrl,
      imagePublicId, 
      brand,
      category,
      description,
      price,
      countInStock,
      rating,
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





// Update Product details

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If new image uploaded
    if (req.file) {
      
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      // 2️⃣ Upload new image
      const uploadResponse = await uploadonCloudinary(
        req.file.path,
        req.body.category || product.category
      );

      if (!uploadResponse) {
        return res.status(500).json({ message: "Image upload failed" });
      }

      product.image = uploadResponse.secure_url;
      product.imagePublicId = uploadResponse.public_id;
    }

    // Update other fields
    product.name = req.body.name || product.name;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.rating = req.body.rating || product.rating;
    product.countInStock = req.body.countInStock || product.countInStock;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Delete Product Controller
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Get All Products (with search, filter, pagination)
export const getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;       
    const limit = Number(req.query.limit) || 5;   
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: "i" } }
      : {};

    const category = req.query.category
      ? { category: req.query.category }
      : {};

    const priceFilter = {};
    if (req.query.minPrice) {
      priceFilter.$gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      priceFilter.$lte = Number(req.query.maxPrice);
    }
    const price = Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {};

    // Final filter object
    const filter = { ...keyword, ...category, ...price };

    // Get total products count
    const total = await Product.countDocuments(filter);

    // Get products with filter + pagination
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Products fetched successfully",
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





//  Get Single Product by ID
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

