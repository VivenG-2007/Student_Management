package in.viven.CRUDSpringBootDemo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "in.viven.CRUDSpringBootDemo.repositories.mongo")
public class MongoConfig {
}
