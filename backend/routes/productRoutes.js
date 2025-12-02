import { Router } from "express";
const router = Router();
import { Types } from "mongoose";

import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

/**
 * Obtiene todas las variantes.
 *
 * @route GET /products
 * @returns {Array<Object>} Lista de variantes pobladas.
 */
router.get("/", async (_, res) => {
  // ... resto del código igual ...
  try {
    const variants = await ProductVariant.find().populate("product");
    res.status(200).json(variants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener productos", details: err.message });
  }
});

// ... El resto del archivo productRoutes.js se mantiene igual,
// pero asegúrate de NO tener @returns {Array<import...>} en ningún lado.
// Si hay otro bloque similar, cámbialo a {Array<Object>}.

// ... (Resto del código de productRoutes.js) ...
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

router.get("/inventory", async (_, res) => {
  try {
    const variants = await ProductVariant.find().populate("product");

    const inventoryData = variants.map((variant) => ({
      _id: variant._id,
      product: variant.product,
      size: variant.size,
      sku: variant.sku,
      stock: variant.stock,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));

    res.status(200).json(inventoryData);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener inventario", details: err.message });
  }
});

router.get("/admin/all", verifyToken, hasPermission(0), async (_, res) => {
  try {
    const products = await Product.find();

    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await ProductVariant.find({ product: product._id });
        return {
          ...product.toObject(),
          variants: variants,
        };
      })
    );

    res.status(200).json(productsWithVariants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener productos", details: err.message });
  }
});

router.post("/admin", verifyToken, hasPermission(0), async (req, res) => {
  const {
    name,
    base_price,
    description,
    image_url,
    category,
    productType,
    variants,
  } = req.body;

  if (!name || !base_price || !category || !productType) {
    return res.status(400).json({
      error:
        "Faltan campos requeridos: name, base_price, category, productType",
    });
  }

  try {
    const newProduct = new Product({
      name,
      base_price,
      description,
      image_url: image_url || "sources/img/logo_negro.png",
      category,
      productType,
    });
    await newProduct.save();

    if (variants && variants.length > 0) {
      const variantsToInsert = variants.map((variant) => ({
        ...variant,
        product: newProduct._id,
      }));
      await ProductVariant.insertMany(variantsToInsert);
    }

    const createdVariants = await ProductVariant.find({
      product: newProduct._id,
    });
    const productWithVariants = {
      ...newProduct.toObject(),
      variants: createdVariants,
    };

    res.status(201).json(productWithVariants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al crear el producto", details: err.message });
  }
});

router.get("/:id/variants", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const variants = await ProductVariant.find({ product: id });
    res.status(200).json(variants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener variantes", details: err.message });
  }
});

router.put("/admin/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      base_price,
      description,
      image_url,
      category,
      productType,
      variants,
    } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, base_price, description, image_url, category, productType },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (variants && variants.length > 0) {
      await ProductVariant.deleteMany({ product: id });

      const variantsToInsert = variants.map((variant) => ({
        ...variant,
        product: id,
      }));
      await ProductVariant.insertMany(variantsToInsert);
    }

    const updatedVariants = await ProductVariant.find({ product: id });
    const productWithVariants = {
      ...updatedProduct.toObject(),
      variants: updatedVariants,
    };

    res.status(200).json(productWithVariants);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al actualizar el producto", details: err.message });
  }
});

router.delete("/admin/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    await ProductVariant.deleteMany({ product: id });
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al eliminar el producto", details: err.message });
  }
});

router.put(
  "/variants/:variantId/stock",
  verifyToken,
  hasPermission(0),
  async (req, res) => {
    try {
      const { variantId } = req.params;
      const { stock } = req.body;

      if (!Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ error: "ID de variante no válido" });
      }

      if (stock === undefined || stock < 0) {
        return res
          .status(400)
          .json({ error: "Stock debe ser un número mayor o igual a 0" });
      }

      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        variantId,
        { stock: parseInt(stock) },
        { new: true, runValidators: true }
      );

      if (!updatedVariant) {
        return res.status(404).json({ error: "Variante no encontrada" });
      }

      res.status(200).json({
        message: "Stock actualizado correctamente",
        variant: updatedVariant,
      });
    } catch (err) {
      res.status(500).json({
        error: "Error al actualizar el stock",
        details: err.message,
      });
    }
  }
);

export default router;
