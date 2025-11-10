import { Router } from "express";
const router = Router();
import Review from "../models/Review.js";
import Product from "../models/Product.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// GET /reviews - Obtener reseñas de un producto (Público)
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener reseñas', error: error.message });
    }
});

// GET /reviews/user - Obtener reseñas del usuario logueado (Protegido)
router.get('/user/my-reviews', verifyToken, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id }) // ← CAMBIADO: req.user.id
            .populate('product', 'name base_price')
            .sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tus reseñas', error: error.message });
    }
});

// POST /reviews - Crear nueva reseña (Protegido - Usuarios autenticados)
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            product,
            rating,
            title,
            comment,
            quality_rating,
            comfort_rating,
            value_rating,
            reviewer_name,
            reviewer_location,
            media = []
        } = req.body;

        // Verificar si el usuario ya reseñó este producto
        const existingReview = await Review.findOne({
            user: req.user.id, // ← CAMBIADO: req.user.id
            product: product
        });

        if (existingReview) {
            return res.status(400).json({ message: 'Ya has reseñado este producto' });
        }

        // Verificar que el producto existe
        const productExists = await Product.findById(product);
        if (!productExists) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Crear la reseña
        const review = new Review({
            user: req.user.id, // ← CAMBIADO: req.user.id
            product,
            rating,
            title,
            comment,
            quality_rating,
            comfort_rating,
            value_rating,
            reviewer_name,
            reviewer_location,
            media,
            verified_purchase: true
        });

        await review.save();

        // Popular la respuesta con datos del usuario y producto
        await review.populate('user', 'username');
        await review.populate('product', 'name base_price');

        res.status(201).json({
            message: 'Reseña creada exitosamente',
            review: review
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al crear reseña', error: error.message });
    }
});

// PUT /reviews/:id - Actualizar reseña (Protegido - Solo el dueño)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        // Verificar que el usuario es el dueño de la reseña
        if (review.user.toString() !== req.user.id) { // ← CAMBIADO: req.user.id
            return res.status(403).json({ message: 'No tienes permiso para editar esta reseña' });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('user', 'username').populate('product', 'name base_price');

        res.json({
            message: 'Reseña actualizada exitosamente',
            review: updatedReview
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar reseña', error: error.message });
    }
});

// DELETE /reviews/:id - Eliminar reseña (Protegido - Solo el dueño o admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        // Verificar permisos (dueño o admin)
        if (review.user.toString() !== req.user.id && req.userPermissionRing > 0) { // ← CAMBIADO: req.user.id
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña' });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.json({ message: 'Reseña eliminada exitosamente' });

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar reseña', error: error.message });
    }
});

export default router;
