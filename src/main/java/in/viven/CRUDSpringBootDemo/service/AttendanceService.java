package in.viven.CRUDSpringBootDemo.service;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import in.viven.CRUDSpringBootDemo.entity.Student;
import in.viven.CRUDSpringBootDemo.repositories.AttendanceRepository;
import in.viven.CRUDSpringBootDemo.repositories.StudentRepositories;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepositories studentRepositories;

    public AttendanceService(AttendanceRepository attendanceRepository, StudentRepositories studentRepositories) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepositories = studentRepositories;
    }

    @Transactional
    public Attendance markAttendance(Long studentId, LocalDate date, String status, String remarks, String markedBy) {
        Student student = studentRepositories.findActiveById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + studentId));

        String sanitizedStatus = "PRESENT".equalsIgnoreCase(status) ? "PRESENT" : "ABSENT";

        Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDate(studentId, date);
        Attendance record;
        if (existing.isPresent()) {
            record = existing.get();
            record.setStatus(sanitizedStatus);
            if (remarks != null) record.setRemarks(remarks);
            record.setMarkedBy(markedBy != null ? markedBy : "admin");
        } else {
            record = new Attendance(student, date, sanitizedStatus, markedBy, remarks);
        }

        return attendanceRepository.save(record);
    }

    @Transactional
    public List<Attendance> markBatchAttendance(List<Map<String, Object>> entries, LocalDate date, String markedBy) {
        List<Attendance> saved = new ArrayList<>();
        for (Map<String, Object> entry : entries) {
            Number studentIdNum = (Number) entry.get("studentId");
            if (studentIdNum == null) continue;
            Long studentId = studentIdNum.longValue();
            String status = (String) entry.getOrDefault("status", "PRESENT");
            String remarks = (String) entry.get("remarks");

            try {
                Attendance att = markAttendance(studentId, date, status, remarks, markedBy);
                saved.add(att);
            } catch (Exception ignored) {
            }
        }
        return saved;
    }

    public Map<String, Object> getStudentAttendanceSummary(Long studentId) {
        Student student = studentRepositories.findActiveById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + studentId));

        long totalClasses = attendanceRepository.countByStudentId(studentId);
        long presentDays = attendanceRepository.countByStudentIdAndStatus(studentId, "PRESENT");
        long absentDays = attendanceRepository.countByStudentIdAndStatus(studentId, "ABSENT");

        double percentage = totalClasses > 0 ? (double) presentDays / totalClasses * 100.0 : 100.0;
        double roundedPercentage = Math.round(percentage * 10.0) / 10.0;

        List<Attendance> records = attendanceRepository.findByStudentIdOrderByDateDesc(studentId);

        List<Map<String, Object>> recordMaps = new ArrayList<>();
        for (Attendance a : records) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("date", a.getDate().toString());
            m.put("status", a.getStatus());
            m.put("remarks", a.getRemarks());
            m.put("markedBy", a.getMarkedBy());
            recordMaps.add(m);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("studentId", student.getId());
        summary.put("studentName", student.getName());
        summary.put("rollno", student.getRollno());
        summary.put("email", student.getEmail());
        summary.put("subject", student.getSubject());
        summary.put("totalClasses", totalClasses);
        summary.put("presentDays", presentDays);
        summary.put("absentDays", absentDays);
        summary.put("attendancePercentage", roundedPercentage);
        summary.put("records", recordMaps);

        return summary;
    }

    public List<Map<String, Object>> getAllStudentsAttendanceOverview(LocalDate date) {
        List<Student> students = studentRepositories.findAllActive();
        List<Attendance> dateAttendances = date != null ? attendanceRepository.findByDate(date) : Collections.emptyList();

        Map<Long, String> statusMapForDate = new HashMap<>();
        for (Attendance a : dateAttendances) {
            statusMapForDate.put(a.getStudent().getId(), a.getStatus());
        }

        List<Map<String, Object>> overviewList = new ArrayList<>();
        for (Student s : students) {
            long total = attendanceRepository.countByStudentId(s.getId());
            long present = attendanceRepository.countByStudentIdAndStatus(s.getId(), "PRESENT");
            long absent = attendanceRepository.countByStudentIdAndStatus(s.getId(), "ABSENT");
            double pct = total > 0 ? (double) present / total * 100.0 : 100.0;
            double roundedPct = Math.round(pct * 10.0) / 10.0;

            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("name", s.getName());
            item.put("rollno", s.getRollno());
            item.put("email", s.getEmail());
            item.put("subject", s.getSubject());
            item.put("age", s.getAge());
            item.put("statusForDate", statusMapForDate.getOrDefault(s.getId(), "UNMARKED"));
            item.put("totalClasses", total);
            item.put("presentDays", present);
            item.put("absentDays", absent);
            item.put("attendancePercentage", roundedPct);

            overviewList.add(item);
        }

        return overviewList;
    }
}
