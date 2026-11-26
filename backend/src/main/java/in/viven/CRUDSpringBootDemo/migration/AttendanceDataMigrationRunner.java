package in.viven.CRUDSpringBootDemo.migration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AttendanceDataMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AttendanceDataMigrationRunner.class);

    private final AttendanceMigrationService migrationService;

    public AttendanceDataMigrationRunner(AttendanceMigrationService migrationService) {
        this.migrationService = migrationService;
    }

    @Override
    public void run(String... args) {
        log.info("Running automatic attendance data check / migration to MongoDB Atlas...");
        try {
            Map<String, Object> result = migrationService.migrateFromPostgres();
            log.info("Attendance migration runner result: {}", result);
        } catch (Exception e) {
            log.warn("Attendance migration check encountered an error (application will continue): {}", e.getMessage());
        }
    }
}
