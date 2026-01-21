# backend/Dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom + download deps first (better cache)
COPY pom.xml ./
RUN mvn -q -e -DskipTests dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar (assumes single jar in target)
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
