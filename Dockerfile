# El build de Angular se realiza en GitHub Actions antes de construir esta imagen.
# El workflow copia dist/ al servidor vía rsync y luego ejecuta docker compose build.
FROM nginx:alpine

COPY dist/ondra-monitor/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 7695

CMD ["nginx", "-g", "daemon off;"]
