import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import routes from './routes';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);
const mongoUri = process.env.MONGODB_URI;
const frontendUrl = process.env.FRONTEND_URL ?? '*';

app.use(
	cors({
		origin: (origin, callback) => {
			// allow requests with no origin 
			if (!origin || origin.startsWith('http://localhost') || origin === frontendUrl) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	})
);
app.use(express.json());

app.get('/health', (_req, res) => {
	return res.status(200).json({ status: 'ok' });
});

app.use(routes);

const start = async () => {
	if (!mongoUri) {
		throw new Error('MONGODB_URI is not configured.');
	}

	await mongoose.connect(mongoUri);
	app.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`Backend server listening on port ${port}`);
	});
};

void start();
