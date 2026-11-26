package in.viven.CRUDSpringBootDemo.migration;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import in.viven.CRUDSpringBootDemo.repositories.mongo.AttendanceRepository;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

@Service
public class AttendanceMigrationService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceMigrationService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AttendanceRepository attendanceRepository;
    private final MongoTemplate mongoTemplate;

    public AttendanceMigrationService(JdbcTemplate jdbcTemplate,
                                      AttendanceRepository attendanceRepository,
                                      MongoTemplate mongoTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.attendanceRepository = attendanceRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public Map<String, Object> migrateFromPostgres() {
        Map<String, Object> result = new HashMap<>();

        // 1. Fast connectivity ping to MongoDB Atlas
        try {
            mongoTemplate.executeCommand(new Document("ping", 1));
            log.info("Successfully pinged MongoDB Atlas cluster.");
        } catch (Exception pingEx) {
            log.error("MongoDB Atlas is NOT reachable from this environment! Reason: {}", pingEx.getMessage());
            log.error("IMPORTANT: If running on Render or cloud, you MUST add '0.0.0.0/0' to MongoDB Atlas -> Network Access -> IP Access List.");
            result.put("status", "UNREACHABLE");
            result.put("error", pingEx.getMessage());
            result.put("hint", "Add 0.0.0.0/0 (Allow access from anywhere) in MongoDB Atlas under Network Access -> IP Access List.");
            return result;
        }

        try {
            // 2. Check if postgres attendance table exists in Supabase
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

            log.info("Starting batch migration of attendance records from Supabase PostgreSQL to MongoDB Atlas...");

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

            // 3. Fetch existing attendance records from Mongo once into memory
            List<Attendance> existingDocs = attendanceRepository.findAll();
            Set<String> existingKeys = new HashSet<>();
            for (Attendance doc : existingDocs) {
                if (doc.getStudentId() != null && doc.getDate() != null) {
                    existingKeys.add(doc.getStudentId() + "_" + doc.getDate());
                }
            }

            List<Attendance> docsToInsert = new ArrayList<>();
            int alreadyMigratedCount = 0;

            for (Map<String, Object> row : pgRecords) {
                Long studentId = (Long) row.get("student_id");
                LocalDate date = (LocalDate) row.get("date");
                String status = (String) row.get("status");
                String markedBy = (String) row.get("marked_by");
                String remarks = (String) row.get("remarks");

                if (studentId == null || date == null) {
                    continue;
                }

                String key = studentId + "_" + date;
                if (existingKeys.contains(key)) {
                    alreadyMigratedCount++;
                } else {
                    Attendance mongoDoc = new Attendance(studentId, date, status, markedBy, remarks);
                    docsToInsert.add(mongoDoc);
                    existingKeys.add(key); // prevent duplicate in same batch
                }
            }

            // 4. Perform single bulk insert
            if (!docsToInsert.isEmpty()) {
                attendanceRepository.saveAll(docsToInsert);
                log.info("Bulk-saved {} attendance records to MongoDB Atlas.", docsToInsert.size());
            }

            long totalInMongo = attendanceRepository.count();
            log.info("Migration finished: {} new records migrated, {} already existed, {} total records in MongoDB Atlas.",
                    docsToInsert.size(), alreadyMigratedCount, totalInMongo);

            result.put("status", "SUCCESS");
            result.put("source", "Supabase PostgreSQL");
            result.put("destination", "MongoDB Atlas");
            result.put("migrated", docsToInsert.size());
            result.put("alreadyMigrated", alreadyMigratedCount);
            result.put("totalInMongo", totalInMongo);
            result.put("message", "Attendance migration to MongoDB Atlas finished successfully");
            return result;

        } catch (Exception e) {
            log.error("Error during attendance migration: {}", e.getMessage(), e);
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
            return result;
        }
    }
}
