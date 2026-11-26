package in.viven.CRUDSpringBootDemo.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "attendance")
@CompoundIndex(name = "student_date_idx", def = "{'studentId': 1, 'date': 1}", unique = true)
public class Attendance {

    @Id
    private String id;

    @Indexed
    private Long studentId;

    @Indexed
    private LocalDate date;

    private String status; // "PRESENT" or "ABSENT"

    private String markedBy = "admin";

    private String remarks;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Attendance() {
    }

    public Attendance(Long studentId, LocalDate date, String status, String markedBy, String remarks) {
        this.studentId = studentId;
        this.date = date;
        this.status = status;
        this.markedBy = markedBy != null ? markedBy : "admin";
        this.remarks = remarks;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMarkedBy() {
        return markedBy;
    }

    public void setMarkedBy(String markedBy) {
        this.markedBy = markedBy;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
