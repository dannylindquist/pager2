import { Request, Response } from "polka";

export type RequestHandler = (req: Request, res: Response) => Promise<void>;
