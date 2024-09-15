FROM node:20 AS frontend-build
WORKDIR /app
COPY . .
RUN \
    npm install -g @angular/cli && \
    npm install && \
    ng build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY PuzzApi/PuzzAPI .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist/puzz/browser ./wwwroot
COPY docker/entrypoint.sh .
RUN chmod +x entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
