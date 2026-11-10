package in.viven.CRUDSpringBootDemo.repositories;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    List<Attendance> findByStudentIdOrderByDateDesc(Long studentId);

    List<Attendance> findByDate(LocalDate date);

    long countByStudentIdAndStatus(Long studentId, String status);

    long countByStudentId(Long studentId);

    void deleteByStudentId(Long studentId);
}

