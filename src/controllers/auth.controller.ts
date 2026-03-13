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

        successResponse(res, 201, {});
    } catch (error) {
        errorResponse(res, 400, "INVALID_REQUEST");
    }
};


export const login = async (req: Request, res: Response) => {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
        errorResponse(res, 400, parsedData.error.toString());
    }

    try {

    } catch (error) {

    }
}