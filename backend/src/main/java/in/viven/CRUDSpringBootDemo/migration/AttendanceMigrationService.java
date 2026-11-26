package in.viven.CRUDSpringBootDemo.migration;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import in.viven.CRUDSpringBootDemo.repositories.mongo.AttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AttendanceMigrationService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceMigrationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AttendanceRepository attendanceRepository;

    public AttendanceMigrationService(JdbcTemplate jdbcTemplate, AttendanceRepository attendanceRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.attendanceRepository = attendanceRepository;
    }

    public Map<String, Object> migrateFromPostgres() {
        Map<String, Object> result = new HashMap<>();
        int migratedCount = 0;
        int alreadyMigratedCount = 0;
        int failedCount = 0;

        try {
            // Check if postgres attendance table exists
            Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance'",
                    Integer.class
            );

            if (tableCount == null || tableCount == 0) {
                log.info("No PostgreSQL 'attendance' table found in Supabase. Nothing to migrate.");
                result.put("status", "NO_TABLE");
                result.put("message", "PostgreSQL attendance table does not exist in Supabase");
                result.put("totalInMongo", attendanceRepository.count());
                return result;
            }

            log.info("Starting migration of attendance records from Supabase PostgreSQL to MongoDB Atlas...");

            List<Map<String, Object>> pgRecords = jdbcTemplate.query(
                    "SELECT id, student_id, date, status, marked_by, remarks, created_at FROM attendance ORDER BY id ASC",
                    (rs, rowNum) -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("id", rs.getLong("id"));
                        row.put("student_id", rs.getLong("student_id"));
                        Date sqlDate = rs.getDate("date");
                        row.put("date", sqlDate != null ? sqlDate.toLocalDate() : null);
                        row.put("status", rs.getString("status"));
                        row.put("marked_by", rs.getString("marked_by"));
                        row.put("remarks", rs.getString("remarks"));
                        return row;
                    }
            );

            log.info("Found {} attendance records in Supabase PostgreSQL.", pgRecords.size());

            for (Map<String, Object> row : pgRecords) {
                try {
                    Long studentId = (Long) row.get("student_id");
                    LocalDate date = (LocalDate) row.get("date");
                    String status = (String) row.get("status");
                    String markedBy = (String) row.get("marked_by");
                    String remarks = (String) row.get("remarks");

                    if (studentId == null || date == null) {
                        continue;
                    }

                    Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDate(studentId, date);
                    if (existing.isPresent()) {
                        alreadyMigratedCount++;
                    } else {
                        Attendance mongoDoc = new Attendance(studentId, date, status, markedBy, remarks);
                        attendanceRepository.save(mongoDoc);
                        migratedCount++;
                    }
                } catch (Exception ex) {
                    log.error("Failed to migrate record {}: {}", row.get("id"), ex.getMessage());
                    failedCount++;
                }
            }

            long totalInMongo = attendanceRepository.count();
            log.info("Migration complete: {} new records migrated, {} already existed, {} total records in MongoDB Atlas.",
                    migratedCount, alreadyMigratedCount, totalInMongo);

            result.put("status", "SUCCESS");
            result.put("source", "Supabase PostgreSQL");
            result.put("destination", "MongoDB Atlas");
            result.put("migrated", migratedCount);
            result.put("alreadyMigrated", alreadyMigratedCount);
            result.put("failed", failedCount);
            result.put("totalInMongo", totalInMongo);
            result.put("message", "Attendance migration to MongoDB Atlas finished successfully");
            return result;

        } catch (Exception e) {
            log.error("Error during attendance migration: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            result.put("migrated", migratedCount);
            result.put("totalInMongo", attendanceRepository.count());
            return result;
        }
    }
}
