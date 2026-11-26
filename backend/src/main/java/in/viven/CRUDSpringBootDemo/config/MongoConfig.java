package in.viven.CRUDSpringBootDemo.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import javax.net.ssl.SSLContext;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableMongoRepositories(
        basePackages = "in.viven.CRUDSpringBootDemo.repositories.mongo",
        mongoTemplateRef = "mongoTemplate"
)
public class MongoConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoConfig.class);

    @Value("${spring.mongodb.uri:${spring.data.mongodb.uri:${MONGODB_URI:mongodb+srv://25r11a05cm_db_user:T6TSXLvoXBN2cWeF@cluster0.9vczujb.mongodb.net/student_management?retryWrites=true&w=majority}}}")
    private String mongoUri;

    @Value("${spring.mongodb.database:${spring.data.mongodb.database:${MONGODB_DATABASE:student_management}}}")
    private String databaseName;

    @Bean
    @Primary
    public MongoClient mongoClient() {
        log.info("Configuring MongoDB Atlas MongoClient with URI: {}", maskUri(mongoUri));
        ConnectionString connectionString = new ConnectionString(mongoUri);

        MongoClientSettings.Builder settingsBuilder = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToSocketSettings(builder -> builder
                        .connectTimeout(20, TimeUnit.SECONDS)
                        .readTimeout(20, TimeUnit.SECONDS))
                .applyToClusterSettings(builder -> builder
                        .serverSelectionTimeout(20, TimeUnit.SECONDS));

        try {
            SSLContext sslContext = SSLContext.getInstance("TLSv1.2");
            sslContext.init(null, null, null);
            settingsBuilder.applyToSslSettings(ssl -> ssl.enabled(true).context(sslContext));
            log.info("Explicitly configured SSLContext to TLSv1.2 for MongoDB Atlas compatibility.");
        } catch (Exception e) {
            log.warn("Could not set explicit TLSv1.2 context, falling back to default SSL: {}", e.getMessage());
            settingsBuilder.applyToSslSettings(ssl -> ssl.enabled(true));
        }

        return MongoClients.create(settingsBuilder.build());
    }

    @Bean
    @Primary
    public MongoDatabaseFactory mongoDatabaseFactory(MongoClient mongoClient) {
        ConnectionString connectionString = new ConnectionString(mongoUri);
        String db = connectionString.getDatabase();
        if (db == null || db.trim().isEmpty()) {
            db = databaseName != null && !databaseName.trim().isEmpty() ? databaseName.trim() : "student_management";
        }
        log.info("Using MongoDB database: {}", db);
        return new SimpleMongoClientDatabaseFactory(mongoClient, db);
    }

    @Bean
    @Primary
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDatabaseFactory) {
        return new MongoTemplate(mongoDatabaseFactory);
    }

    private String maskUri(String uri) {
        if (uri == null) return "null";
        return uri.replaceAll(":[^@/]+@", ":****@");
    }
}
