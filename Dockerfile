# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY backend/pom.xml .
RUN mvn dependency:resolve -B || true

# Copy source code and package application
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render assigns a dynamic port via $PORT
ENV PORT=8080
EXPOSE 8080

# Configure JVM container memory limit (safe for Render 512MB free tier)
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]

