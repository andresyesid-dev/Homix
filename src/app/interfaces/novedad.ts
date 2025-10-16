import { Timestamp } from "firebase/firestore";

export interface Novedad {
    id?: string;
    titulo?: string;
    contenido?: string;
    fecha?: Timestamp;
}
