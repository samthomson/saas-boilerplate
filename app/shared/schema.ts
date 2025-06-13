export type User = {
	id: string;
	email: string;
	role: "ADMIN" | "USER" 
	createdAt: string;
}

export type JWTPayload = {
	userId: string;
	email: string;
	role: User['role'];
	iat?: number;
	exp?: number;
}