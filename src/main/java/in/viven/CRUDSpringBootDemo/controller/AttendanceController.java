package in.viven.CRUDSpringBootDemo.controller;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import in.viven.CRUDSpringBootDemo.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
        RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS
})
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    // Single student attendance marking
    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> req) {
        Number studentIdNum = (Number) req.get("studentId");
        if (studentIdNum == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentId is required"));
        }

        LocalDate date = LocalDate.now();
        if (req.get("date") != null) {
            try {
                date = LocalDate.parse(req.get("date").toString());
            } catch (Exception ignored) {
            }
        }

        String status = (String) req.getOrDefault("status", "PRESENT");
        String remarks = (String) req.get("remarks");
        String markedBy = (String) req.getOrDefault("markedBy", "admin");

        try {
            Attendance attendance = attendanceService.markAttendance(studentIdNum.longValue(), date, status, remarks, markedBy);
            return ResponseEntity.ok(attendance);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Batch attendance marking for a specific date
    @PostMapping("/batch")
    public ResponseEntity<?> markBatchAttendance(@RequestBody Map<String, Object> req) {
        LocalDate date = LocalDate.now();
        if (req.get("date") != null) {
            try {
                date = LocalDate.parse(req.get("date").toString());
            } catch (Exception ignored) {
            }
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) req.get("entries");
        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "entries list is required"));
        }

        String markedBy = (String) req.getOrDefault("markedBy", "admin");
        List<Attendance> saved = attendanceService.markBatchAttendance(entries, date, markedBy);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Attendance saved for " + saved.size() + " students");
        res.put("date", date.toString());
        res.put("count", saved.size());
        return ResponseEntity.ok(res);
    }

    // Get a specific student's attendance summary & full history
    @GetMapping("/student/{studentId}/summary")
    public ResponseEntity<?> getStudentSummary(@PathVariable Long studentId) {
        try {
            Map<String, Object> summary = attendanceService.getStudentAttendanceSummary(studentId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Overview of all students + their attendance status for a given date (or today)
    @GetMapping("/overview")
    public ResponseEntity<List<Map<String, Object>>> getOverview(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        List<Map<String, Object>> overview = attendanceService.getAllStudentsAttendanceOverview(date);
        return ResponseEntity.ok(overview);
    }
}
