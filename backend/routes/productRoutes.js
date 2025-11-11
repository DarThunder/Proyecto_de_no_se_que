import { Router } from "express";
const router = Router();
import { Types } from "mongoose";

import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

router.get("/", async (_, res) => {
  try {
    const variants = await ProductVariant.find().populate("product");
    res.status(200).json(variants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener productos", details: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const variant = await ProductVariant.findById(id).populate("product");

    if (!variant) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json(variant);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener el producto", details: err.message });
  }
});

router.post("/", verifyToken, hasPermission(1), async (req, res) => {
  const {
    name,
    base_price,
    description,
    size,
    sku,
    stock,
    image_url,
    category,
  } = req.body;

  if (!name || !base_price || !sku || !stock || !size || !category) {
    return res.status(400).json({
      error: "Faltan campos: name, base_price, sku, stock, size, category",
    });
  }

  try {
    const newProduct = new Product({
      name,
      base_price,
      description,
      image_url,
      category,
    });
    await newProduct.save();

    const newVariant = new ProductVariant({
      product: newProduct._id,
      size,
      sku,
      stock,
    });
    await newVariant.save();

    res.status(201).json({
      message: "Producto creado exitosamente",
      product_id: newProduct._id,
      variant_id: newVariant._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear el producto", details: err.message });
  }
});

export default router;
