package in.viven.CRUDSpringBootDemo.controller;

import in.viven.CRUDSpringBootDemo.entity.Student;
import in.viven.CRUDSpringBootDemo.service.StudentService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
public class StudentWebController {

    private final StudentService studentService;

    public StudentWebController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/students";
    }

    @GetMapping("/students")
    public String listActiveStudents(Model model) {
        List<Student> activeStudents = studentService.getAllStudents();
        List<Student> deletedStudents = studentService.getDeletedStudents();

        model.addAttribute("students", activeStudents);
        model.addAttribute("activeCount", activeStudents.size());
        model.addAttribute("deletedCount", deletedStudents.size());
        model.addAttribute("viewMode", "active");
        model.addAttribute("newStudent", new Student());
        return "students";
    }

    @GetMapping("/students/deleted")
    public String listDeletedStudents(Model model) {
        List<Student> activeStudents = studentService.getAllStudents();
        List<Student> deletedStudents = studentService.getDeletedStudents();

        model.addAttribute("students", deletedStudents);
        model.addAttribute("activeCount", activeStudents.size());
        model.addAttribute("deletedCount", deletedStudents.size());
        model.addAttribute("viewMode", "deleted");
        model.addAttribute("newStudent", new Student());
        return "students";
    }

    @PostMapping("/students/add")
    public String addStudent(@ModelAttribute("newStudent") Student student,
                             RedirectAttributes redirectAttributes) {
        try {
            studentService.createStudent(student);
            redirectAttributes.addFlashAttribute("successMessage", "Student '" + student.getName() + "' created successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Failed to create student: " + e.getMessage());
        }
        return "redirect:/students";
    }

    @PostMapping("/students/edit/{id}")
    public String updateStudent(@PathVariable Long id,
                                @ModelAttribute Student student,
                                RedirectAttributes redirectAttributes) {
        try {
            Student updated = studentService.updateStudent(id, student);
            if (updated != null) {
                redirectAttributes.addFlashAttribute("successMessage", "Student record updated successfully!");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Student not found for update!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Update failed: " + e.getMessage());
        }
        return "redirect:/students";
    }

    @PostMapping("/students/soft-delete/{id}")
    public String softDeleteStudent(@PathVariable Long id,
                                    RedirectAttributes redirectAttributes) {
        boolean success = studentService.softDeleteStudent(id);
        if (success) {
            redirectAttributes.addFlashAttribute("successMessage", "Student moved to trash!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Could not soft-delete student!");
        }
        return "redirect:/students";
    }

    @PostMapping("/students/restore/{id}")
    public String restoreStudent(@PathVariable Long id,
                                 RedirectAttributes redirectAttributes) {
        boolean success = studentService.restoreStudent(id);
        if (success) {
            redirectAttributes.addFlashAttribute("successMessage", "Student restored to active list!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Could not restore student!");
        }
        return "redirect:/students/deleted";
    }

    @PostMapping("/students/delete/{id}")
    public String permanentDeleteStudent(@PathVariable Long id,
                                         @RequestParam(value = "redirectView", defaultValue = "active") String redirectView,
                                         RedirectAttributes redirectAttributes) {
        boolean success = studentService.deleteStudent(id);
        if (success) {
            redirectAttributes.addFlashAttribute("successMessage", "Student permanently deleted!");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Could not delete student!");
        }
        return "deleted".equals(redirectView) ? "redirect:/students/deleted" : "redirect:/students";
    }
}

