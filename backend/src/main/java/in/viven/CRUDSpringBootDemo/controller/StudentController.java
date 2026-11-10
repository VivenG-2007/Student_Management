package in.viven.CRUDSpringBootDemo.controller;

import in.viven.CRUDSpringBootDemo.entity.Student;
import in.viven.CRUDSpringBootDemo.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
        RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS
})
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    // Health check / root of API
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Student CRUD Service");
        return ResponseEntity.ok(status);
    }

    // Create
    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        Student createdStudent = studentService.createStudent(student);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdStudent);
    }

    // Read single student (standard + legacy alias)
    @GetMapping("/{id}")
    public ResponseEntity<?> getStudentById(@PathVariable Long id) {
        Student studentRes = studentService.getStudent(id);
        if (studentRes == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Student not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        return ResponseEntity.ok(studentRes);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<?> getStudentLegacy(@PathVariable Long id) {
        return getStudentById(id);
    }

    // Read all active students (standard + legacy alias)
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        List<Student> studentList = studentService.getAllStudents();
        return ResponseEntity.ok(studentList != null ? studentList : Collections.emptyList());
    }

    @GetMapping("/get/all")
    public ResponseEntity<List<Student>> getAllStudentsLegacy() {
        return getAllStudents();
    }

    // Read all deleted / archived students
    @GetMapping("/deleted")
    public ResponseEntity<List<Student>> getDeletedStudents() {
        List<Student> deletedList = studentService.getDeletedStudents();
        return ResponseEntity.ok(deletedList != null ? deletedList : Collections.emptyList());
    }

    // Update student (standard + legacy alias)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        Student updatedStudent = studentService.updateStudent(id, student);
        if (updatedStudent == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Student not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        return ResponseEntity.ok(updatedStudent);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateStudentLegacy(@PathVariable Long id, @RequestBody Student student) {
        return updateStudent(id, student);
    }

    // Hard delete student (standard + legacy alias)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        Boolean deleted = studentService.deleteStudent(id);
        if (!deleted) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Student not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Map<String, String> res = new HashMap<>();
        res.put("message", "Record permanently deleted");
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteStudentLegacy(@PathVariable Long id) {
        return deleteStudent(id);
    }

    // Soft delete student (standard + legacy alias)
    @PatchMapping("/{id}/soft-delete")
    public ResponseEntity<?> softDelete(@PathVariable Long id) {
        Boolean isDeleted = studentService.softDeleteStudent(id);
        if (!isDeleted) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Active student not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Map<String, String> res = new HashMap<>();
        res.put("message", "Record is soft-deleted");
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/softdelete/{id}")
    public ResponseEntity<?> softDeleteLegacy(@PathVariable Long id) {
        return softDelete(id);
    }

    // Restore soft-deleted student
    @PatchMapping("/{id}/restore")
    public ResponseEntity<?> restoreStudent(@PathVariable Long id) {
        Boolean restored = studentService.restoreStudent(id);
        if (!restored) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Student not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Map<String, String> res = new HashMap<>();
        res.put("message", "Record restored successfully");
        return ResponseEntity.ok(res);
    }
}
