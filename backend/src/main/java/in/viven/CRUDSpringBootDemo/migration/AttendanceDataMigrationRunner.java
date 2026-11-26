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
        // Run migration in a background thread so it never blocks container startup or health checks
        Thread migrationThread = new Thread(() -> {
            try {
                // Short initial delay so Tomcat starts accepting health check traffic first
                Thread.sleep(2000);
                log.info("Running attendance data check / migration to MongoDB Atlas in background...");
                Map<String, Object> result = migrationService.migrateFromPostgres();
                log.info("Attendance migration background result: {}", result);
            } catch (Exception e) {
                log.warn("Attendance migration check encountered an issue: {}", e.getMessage());
            }
        }, "AttendanceMigrationWorker");

        migrationThread.setDaemon(true);
        migrationThread.start();
    }
}
