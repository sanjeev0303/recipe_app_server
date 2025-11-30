import express, { Request, Response } from "express";
import { db } from "./config/db";
import { favoritesTable } from "./db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "./config/logger";

const app = express();

app.use(express.json());

app.get("/health", async (req: Request, res: Response) => {
    let dbConnected = false;
    try {
        await db.execute('SELECT 1');
        dbConnected = true;
    } catch (error) {
        logger.error({ err: error }, "Database health check failed");
    }

    res.status(dbConnected ? 200 : 503).json({
        success: dbConnected,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
        const { userId, recipeId, title, image, cookTime, servings } = req.body;

        if (!userId || !recipeId || !title) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const newFavorite = await db
            .insert(favoritesTable)
            .values({
                userId,
                recipeId,
                title,
                image,
                cookTime,
                servings,
            })
            .returning();

        res.status(201).json(newFavorite[0]);
    } catch (error) {
        logger.error({ err: error }, "Error adding favorite");
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/api/favorites/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const userFavorites = await db
            .select()
            .from(favoritesTable)
            .where(eq(favoritesTable.userId, userId));

        res.status(200).json(userFavorites);
    } catch (error) {
        logger.error({ err: error }, "Error fetching the favorites");
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.delete("/api/favorites/:userId/:recipeId", async (req: Request, res: Response) => {
    try {
        const { userId, recipeId } = req.params;

        await db
            .delete(favoritesTable)
            .where(
                and(eq(favoritesTable.userId, userId), eq(favoritesTable.recipeId, parseInt(recipeId)))
            );

        res.status(200).json({ message: "Favorite removed successfully" });
    } catch (error) {
        logger.error({ err: error }, "Error removing a favorite");
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default app;
