package in.viven.CRUDSpringBootDemo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "in.viven.CRUDSpringBootDemo.repositories.jpa")
public class JpaConfig {
}
