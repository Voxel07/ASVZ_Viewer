# Production stage
FROM nginx:alpine
# Expects artifacts to be built previously (e.g., in CI) and placed in /dist
COPY ./dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
