package in.viven.CRUDSpringBootDemo.controller;

import in.viven.CRUDSpringBootDemo.entity.Student;
import in.viven.CRUDSpringBootDemo.service.StudentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS
})
public class AuthController {

    private final StudentService studentService;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public AuthController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String role = credentials.getOrDefault("role", "STUDENT").toUpperCase().trim();
        String username = credentials.getOrDefault("username", "").trim();
        String password = credentials.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Username and password are required"));
        }

        if ("ADMIN".equals(role)) {
            if (adminUsername.equalsIgnoreCase(username) && adminPassword.equals(password)) {
                Map<String, Object> res = new HashMap<>();
                res.put("token", "admin-token-" + UUID.randomUUID());
                res.put("role", "ADMIN");
                res.put("username", adminUsername);
                res.put("name", "System Administrator");
                return ResponseEntity.ok(res);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid admin credentials (default: admin / admin123)"));
            }
        } else {
            // Student login: match by rollno or email
            Optional<Student> studentOpt = Optional.empty();
            try {
                int rollno = Integer.parseInt(username);
                studentOpt = studentService.findByRollno(rollno);
            } catch (NumberFormatException ignored) {
            }

            if (studentOpt.isEmpty()) {
                studentOpt = studentService.findByEmail(username);
            }

            if (studentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Student not found with roll number or email: " + username));
            }

            Student student = studentOpt.get();
            String studentPass = student.getPassword();
            // Default password is rollno if password is null or blank
            boolean passMatches = false;
            if (studentPass != null && !studentPass.trim().isEmpty()) {
                passMatches = studentPass.equals(password);
            } else {
                passMatches = String.valueOf(student.getRollno()).equals(password) || "student123".equals(password);
            }

            if (!passMatches) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Incorrect password for roll number " + student.getRollno()));
            }

            Map<String, Object> studentInfo = new HashMap<>();
            studentInfo.put("id", student.getId());
            studentInfo.put("name", student.getName());
            studentInfo.put("rollno", student.getRollno());
            studentInfo.put("email", student.getEmail());
            studentInfo.put("subject", student.getSubject());
            studentInfo.put("age", student.getAge());

            Map<String, Object> res = new HashMap<>();
            res.put("token", "student-token-" + UUID.randomUUID());
            res.put("role", "STUDENT");
            res.put("student", studentInfo);
            return ResponseEntity.ok(res);
        }
    }
}
