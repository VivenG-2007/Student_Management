package in.viven.CRUDSpringBootDemo.repositories.mongo;

import in.viven.CRUDSpringBootDemo.entity.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {

    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    List<Attendance> findByStudentIdOrderByDateDesc(Long studentId);

    List<Attendance> findByDate(LocalDate date);

    long countByStudentIdAndStatus(Long studentId, String status);

    long countByStudentId(Long studentId);

    void deleteByStudentId(Long studentId);
}
