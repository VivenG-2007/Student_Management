package in.viven.CRUDSpringBootDemo.service;

import in.viven.CRUDSpringBootDemo.entity.Student;
import in.viven.CRUDSpringBootDemo.repositories.StudentRepositories;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepositories studentRepositories;

    public StudentService(StudentRepositories studentRepositories) {
        this.studentRepositories = studentRepositories;
    }

    public Student createStudent(Student studentreq) {
        studentreq.setId(null);
        studentreq.setDeleted(false);
        return studentRepositories.save(studentreq);
    }

    public Student getStudent(Long id) {
        return studentRepositories.findActiveById(id).orElse(null);
    }

    public List<Student> getAllStudents() {
        return studentRepositories.findAllActive();
    }

    public List<Student> getDeletedStudents() {
        return studentRepositories.findAllDeleted();
    }

    public Student updateStudent(Long id, Student studentReq) {
        Optional<Student> existing = studentRepositories.findActiveById(id);
        if (existing.isEmpty()) {
            return null;
        }
        Student studentToSave = existing.get();
        if (studentReq.getName() != null && !studentReq.getName().trim().isEmpty()) {
            studentToSave.setName(studentReq.getName().trim());
        }
        if (studentReq.getAge() > 0) {
            studentToSave.setAge(studentReq.getAge());
        }
        if (studentReq.getEmail() != null && !studentReq.getEmail().trim().isEmpty()) {
            studentToSave.setEmail(studentReq.getEmail().trim());
        }
        if (studentReq.getRollno() > 0) {
            studentToSave.setRollno(studentReq.getRollno());
        }
        if (studentReq.getSubject() != null && !studentReq.getSubject().trim().isEmpty()) {
            studentToSave.setSubject(studentReq.getSubject().trim());
        }
        studentToSave.setDeleted(false);
        return studentRepositories.save(studentToSave);
    }

    public Boolean deleteStudent(Long id) {
        if (!studentRepositories.existsById(id)) {
            return false;
        }
        studentRepositories.deleteById(id);
        return true;
    }

    public Boolean softDeleteStudent(Long id) {
        Optional<Student> studentOpt = studentRepositories.findActiveById(id);
        if (studentOpt.isEmpty()) {
            return false;
        }
        Student studentToSave = studentOpt.get();
        studentToSave.setDeleted(true);
        studentRepositories.save(studentToSave);
        return true;
    }

    public Boolean restoreStudent(Long id) {
        Optional<Student> studentOpt = studentRepositories.findById(id);
        if (studentOpt.isEmpty()) {
            return false;
        }
        Student studentToSave = studentOpt.get();
        studentToSave.setDeleted(false);
        studentRepositories.save(studentToSave);
        return true;
    }
}
