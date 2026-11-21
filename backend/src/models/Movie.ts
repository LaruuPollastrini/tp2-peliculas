import { Schema, model, Document, Model, Types } from "mongoose";

export const GENRES = [
  "accion",
  "aventura",
  "animacion",
  "comedia",
  "drama",
  "terror",
  "ciencia-ficcion",
  "suspenso",
  "romance",
  "documental",
] as const;

export type Genre = (typeof GENRES)[number];

export interface IMovie {
  title: string; // texto
  director: string; // texto
  genre: Genre; // texto (enum)
  synopsis?: string; // texto opcional
  durationMin: number; // numero
  rating: number; // numero (0 a 10)
  releaseDate: Date; // fecha
  watched: boolean; // booleano
  owner: string; // id del usuario de Better Auth que la creo
  ownerName: string; // nombre del creador, para mostrarlo sin consultar la coleccion user
}

export interface IMovieDocument extends IMovie, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovieDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    director: {
      type: String,
      required: [true, "Director is required"],
      trim: true,
      maxlength: [80, "Director cannot exceed 80 characters"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      enum: GENRES,
    },
    synopsis: {
      type: String,
      trim: true,
      maxlength: [1000, "Synopsis cannot exceed 1000 characters"],
    },
    durationMin: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [600, "Duration cannot exceed 600 minutes"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating must be between 0 and 10"],
      max: [10, "Rating must be between 0 and 10"],
    },
    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
    },
    watched: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Movie: Model<IMovieDocument> = model<IMovieDocument>("Movie", movieSchema);

export default Movie;
