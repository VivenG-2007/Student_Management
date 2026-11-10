package in.viven.CRUDSpringBootDemo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class RootApiController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> info = new HashMap<>();
        info.put("service", "Student & Attendance Management System - REST API");
        info.put("status", "UP");
        info.put("message", "Backend is running. Access the frontend application via Vercel.");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("health", "/api/students/health");
        endpoints.put("auth_login", "/api/auth/login");
        endpoints.put("students", "/api/students");
        endpoints.put("attendance_overview", "/api/attendance/overview");
        endpoints.put("attendance_mark", "/api/attendance/mark");
        endpoints.put("attendance_batch", "/api/attendance/batch");
        info.put("endpoints", endpoints);

        return ResponseEntity.ok(info);
    }
}
