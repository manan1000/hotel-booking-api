import {z} from "zod";

export const signupSchema = z.object({
    name: z.string().min(1,"Name cannot be empty."),
    email: z.email("Please enter a valid email."),
    password: z.string().min(8,"Password must be atleast 8 characters long."),
    role: z.enum(["customer","owner"]).optional(),
    phone: z.string().optional()
});

export const loginSchema = z.object({
    email: z.email("Please enter a valid email."),
    password: z.string().min(8,"Password must be atleast 8 characters long.")
});