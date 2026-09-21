FROM maven:3.9.10-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
WORKDIR /workspace/backend
RUN mvn --batch-mode dependency:go-offline

COPY backend/src src
RUN mvn --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN useradd --system --uid 10001 nova
COPY --from=build /workspace/backend/target/nova-backend-*.jar app.jar
USER nova

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
