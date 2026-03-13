import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../schemas/auth.schema";
import { errorResponse, successResponse } from "../lib/response";
import { prisma } from "../lib/prisma";

export const signup = async (req: Request, res: Response) => {
    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
        return errorResponse(res, 400, "INVALID_REQUEST");
    }

    const { name, email, password, role, phone } = parsedData.data;

    try {
        const userAlreadyExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userAlreadyExists) {
            return errorResponse(res, 400, "EMAIL_ALREADY_EXISTS");
        }

        const hashedPassword = await Bun.password.hash(password);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role ?? "customer",
                phone: phone ?? null
            }
        });

        const data = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        }
        return successResponse(res, 201, data);
    } catch (error) {
        return errorResponse(res, 500, "INTERNAL_ERROR");
    }
};


export const login = async (req: Request, res: Response) => {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
        return errorResponse(res, 400, "INVALID_REQUEST");
    }

    const { email, password } = parsedData.data;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return errorResponse(res, 401, "INVALID_CREDENTIALS");
        }

        const isValidPassword = await Bun.password.verify(password, user.password);

        if (!isValidPassword) {
            return errorResponse(res, 401, "INVALID_CREDENTIALS");
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            Bun.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        const data = {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };

        return successResponse(res, 200, data);


    } catch (error) {
        return errorResponse(res, 400, "INVALID_REQUEST");
    }
}