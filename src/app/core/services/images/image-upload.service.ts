import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const IMAGE_API_URL = 'https://img-seph.papus.online/api/v1';

export interface UploadImageResponse {
  tipo: string;
  fileName: string;
  rutaRelativa: string;
}

/* Servicio dedicado para subir INE y fotografía a Seph.ImageServer.
No usa ApiResponse porque ese servicio es independiente de
Seph.Principal y devuelve el JSON directo, sin el wrapper. */
@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly http = inject(HttpClient);

  uploadImage(tipo: 'ine' | 'foto', archivo: File) {
    const formData = new FormData();
    formData.append('Tipo', tipo);
    formData.append('Archivo', archivo);

    return this.http.post<UploadImageResponse>(
      `${IMAGE_API_URL}/images/upload`,
      formData
    );
  }

  /* Descarga un archivo ya subido como blob (el interceptor le pega
  el mismo token; un <img> normal no manda ese header). */
  getImageBlob(rutaRelativa: string) {
    return this.http.get(
      `${IMAGE_API_URL}/images/${rutaRelativa}`,
      { responseType: 'blob' }
    );
  }

  /* Borra un archivo ya subido (se usa al reemplazar el INE/foto de
  un registro, para no dejar archivos huérfanos en el servidor). */
  deleteImage(rutaRelativa: string) {
    return this.http.delete(
      `${IMAGE_API_URL}/images/${rutaRelativa}`
    );
  }
}