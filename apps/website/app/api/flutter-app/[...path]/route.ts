import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path;
    const filePath = join(process.cwd(), '..', '..', 'flutter-web-client', 'build', 'web', ...path);
    
    // Se non c'è estensione, assume che sia index.html
    const finalPath = path.length === 0 || !path[path.length - 1].includes('.') 
      ? join(filePath, 'index.html')
      : filePath;
    
    const fileContent = await readFile(finalPath);
    
    // Determina il content type basato sull'estensione
    const ext = finalPath.split('.').pop()?.toLowerCase();
    let contentType = 'text/plain';
    
    switch (ext) {
      case 'html':
        contentType = 'text/html';
        break;
      case 'css':
        contentType = 'text/css';
        break;
      case 'js':
        contentType = 'application/javascript';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'ico':
        contentType = 'image/x-icon';
        break;
      case 'woff':
        contentType = 'font/woff';
        break;
      case 'woff2':
        contentType = 'font/woff2';
        break;
      case 'ttf':
        contentType = 'font/ttf';
        break;
      default:
        contentType = 'text/plain';
    }
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Errore nel servire file Flutter:', error);
    return new NextResponse('File non trovato', { status: 404 });
  }
} 