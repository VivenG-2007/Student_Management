package in.viven.CRUDSpringBootDemo.repositories;

import in.viven.CRUDSpringBootDemo.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepositories extends JpaRepository<Student, Long> {

    @Query("SELECT s FROM Student s WHERE s.id = :id AND (s.isDeleted = false OR s.isDeleted IS NULL)")
    Optional<Student> findActiveById(@Param("id") Long id);

    @Query("SELECT s FROM Student s WHERE s.isDeleted = false OR s.isDeleted IS NULL ORDER BY s.id ASC")
    List<Student> findAllActive();

    @Query("SELECT s FROM Student s WHERE s.isDeleted = true ORDER BY s.id ASC")
    List<Student> findAllDeleted();

    Optional<Student> findByIdAndIsDeletedFalse(Long id);

    List<Student> findByIsDeletedFalse();
}
