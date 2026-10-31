-- =============================================================================
-- DATABASE PRESENSI MATA KULIAH STATISTIKA (KELAS TI25C) - MYSQL
-- Struktur tabel sederhana, bersih, dan mudah dipelajari oleh pemula.
-- =============================================================================
CREATE DATABASE IF NOT EXISTS `presensi_statistika` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `presensi_statistika`;

-- -------------------------------------------------------------
-- 1. Tabel Pengguna (Mahasiswa dan Admin/Dosen)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `profile_photo` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `name`, `password`, `role`, `profile_photo`, `created_at`, `updated_at`) VALUES
(1, 'Dafa Rizki', '$2b$10$OYnJWlo9TvVsUAOMy5jOeO/DfN0nUiE5BilEljyHgBvsF46ehGsFC', 'user', NULL, '2026-10-08 02:02:18', '2026-10-29 06:26:49'),
(2, 'Choirul Mustakim', '$2b$10$h5Ck7ignwt9L1HtMBDMxFuJq6RQ0TQs7Cm4vgqTfHUapzjeVKmZOy', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(3, 'Muhammad Reza Pahlevi Fairuz', '$2b$10$1b2VTtaZ/i1goT3mZIQqS.vDtUxqoyNcG4rv9FUsCFS9aSzehjoh2', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(4, 'Putri Dian Puspita Sari', '$2b$10$LSeEzSEqjqN83gVnvX5cqec2ckB8MXP7yKfW.Nl57wEZqTD5jadSm', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(5, 'Delviera Renada Anrelia', '$2b$10$gZyzHoG.J7Awgvr2O7IjI.aCvVY4hmrLi.jMHJkJbVtsAcquzOsqW', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(6, 'Inggi Febriani Sepina', '$2b$10$3hlHkOu5AS7DgZWQ7T3vUu6UkEbBfUksM/iY1mhZQGh5seIwO4Q8y', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(7, 'Islananda Enjeli', '$2b$10$j8HhAoltDzX/p/hXXBOol.vQVcbb4Ykmvflg6UvZ2/dHsjxZP0oLS', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(8, 'Putra Sadewo', '$2b$10$WdydhhorD1Y7o099hVm52OH1qZC9Uc/0w0DNaPQhdi/k7zq1HX/e2', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(9, 'Dipo Endratanaya Kunto', '$2b$10$MaLa6qI1otO8UGig.x0yqORhwIZsoB8p27jPTDJNTKj6OKzcgj2Na', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(10, 'Bayu Setiawan Hadi', '$2b$10$fGS0uVaGdWPeso3Yl/36R.XOjwp0lmkS34opeVpWXDplTbQ7DN6wq', 'user', NULL, '2026-10-08 02:02:18', '2026-10-08 02:02:18'),
(11, 'Rommy Zaidan Zidna Fann', '$2b$10$tnt6.v7iJTdGUcHAxLRjLOwPHvTkSgfhUQIZUWMx.vtxvz7fPRH3O', 'user', NULL, '2026-10-08 02:02:18', '2026-10-29 06:26:49'),
(12, 'Sayyid Sakhiy Sulaeman', '$2b$10$ye2fajtjojzlpCpNQC9NHOVWgtXO.VPT9RQySO1dNNYM4OujTu5xW', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(13, 'Handini', '$2b$10$l.gxUKLyxVYpjILaptdJj.Zp0t9P5bQDs5ng6nMDnklUH7b7jpevS', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(14, 'Tyara Septyanita', '$2b$10$XiDATfHnzj8P990DCbdRfebGy1oQ47FUb./20Ucd9uxGY24pcGCJW', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(15, 'Syifa Hayatun Nisa', '$2b$10$oy11UVb22vfQzNJgXf2ka.kJ3Xo/KO7K8KfPbokvVDf5zajl44e.u', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(16, 'Ananda Abel Deas Pratama', '$2b$10$pavkxw4EHyfNmkUFJIzLmepeLJoidEfAOsp7NLCXUuJs5pdUTf8FS', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(17, 'Zain Akbar Mujahidan', '$2b$10$wmHu7m7dpsYV.HDvG3eV1uD7u4e9SIJcGQ7N6WCsdSmPn1XOeiiCO', 'user', NULL, '2026-10-08 02:02:19', '2026-10-29 06:26:49'),
(18, 'Muhammad ''Azmi', '$2b$10$cAGqiBHPZAhW6jDjnswNAO.P0O4dPlqZnohpqCwBkswSKFTaIkcHW', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(19, 'IlhamAuliatullah', '$2b$10$pTAd1ab.vVZZ87iR.ragreQeNaRPkVr0MKCZ3jAMJtkt/lKK0YA7e', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(20, 'Rengga Ramdani Anggari', '$2b$10$y.dB354XXd4es4u/lyCBz.U52tpB6UDXL2gSk6UwKyDLDvFSfALUa', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(21, 'Shukoh#Dev', '$2b$10$avN8ZcrPgQqaFsmnLN4adeLlzF1hJDNnYksGkJaKsRQqnu3p4ti9m', 'admin', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(23, 'Asep Fauzan Muhammad Salman Al Baihaqi', '$2b$10$ep1nvk0Wlz8ruKJQKlh6vefY93eoqyT46wWY3TlnuiOQIX5861Xaa', 'user', NULL, '2026-10-08 02:02:19', '2026-10-08 02:02:19'),
(24, 'Naufal Irsyadillah', '$2b$10$F/ZrgkZwdQr0vxo1cEYH2.021kOTxb2./sAdbo7P42LPa1t/Zb48e', 'user', NULL, '2026-10-08 02:02:19', '2026-10-29 06:26:49'),
(25, 'Ahmad Fajar', '$2b$10$vN4i1DkfaYgrhTVexnY3b.csYfJowQjrhp9FOMc0gIP.KqjgRJlCe', 'user', NULL, '2026-10-08 02:02:19', '2026-10-29 06:26:49'),
(26, 'Fadilah Wildan Firdaus', '$2b$10$5nRWWc5CSrcGb9IJ2yna4.UasZU2tb.kiWGDMzVrjy4.X1lTjTdDy', 'user', NULL, '2026-10-08 02:02:20', '2026-10-08 02:02:20'),
(27, 'Andhika Prasetia Nugraha Putra', '$2b$10$WGqpOAHIUmfLIKnFt.OTwusnn2OG1Wvkb4qov5nZ8Z39lpgNuSKT.', 'user', NULL, '2026-10-08 02:02:20', '2026-10-08 02:02:20'),
(28, 'Faqih Hidayatus Salam', '$2b$10$GGfW9fS7nlfn00.41cWr4O2PunRsJjmjW.yj/AnqXECbDe.xdDUsO', 'user', '/uploads/profiles/profile-28-1791481698846.jpg', '2026-10-08 15:50:26', '2026-10-08 17:48:18'),
(29, 'Nisa Amaliyah Zahira', '$2b$10$pILzbGS0LN0Fl2L/dDCb5OmGL8QLHivQsq5qFiciXlUW3Qe.Qti4O', 'user', NULL, '2026-10-14 19:24:44', '2026-10-14 19:24:44'),
(31, 'Rangga Aditama', '$2a$10$qA86yIRS3Q8fePqNcrX1YOdx1nkJExGjEq8tIXSilAZO/X1CPWitO', 'user', NULL, '2026-10-26 10:48:19', '2026-10-26 10:48:19'),
(32, 'Falih Arifin', '$2a$10$IMMjTrI0vDHN0ip5YoxyZeTAu0f7dojrGH.KdSW8ldCXl922t4mMe', 'user', NULL, '2026-10-26 10:48:19', '2026-10-26 10:48:19');

-- -------------------------------------------------------------
-- 2. Tabel Sesi Perkuliahan (Dibuat oleh PJ MK / Dosen)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `meeting_number` INT NOT NULL,
    `title` VARCHAR(255) DEFAULT 'Pertemuan Perkuliahan',
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'closed',
    `duration_minutes` INT DEFAULT 15,
    `opened_at` DATETIME DEFAULT NULL,
    `closed_at` DATETIME DEFAULT NULL,
    `created_by` INT NOT NULL,
    `attendance_mode` VARCHAR(50) DEFAULT 'self',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `sessions` (`id`, `meeting_number`, `title`, `status`, `duration_minutes`, `opened_at`, `closed_at`, `created_by`, `attendance_mode`, `created_at`) VALUES
(3, 1, 'Pertemuan 1', 'open', 125, '2026-10-29 06:25:38', NULL, 1, 'self', '2026-10-29 06:25:38');

-- -------------------------------------------------------------
-- 3. Tabel Catatan Kehadiran Presensi Mahasiswa
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `session_id` INT NOT NULL,
    `status` ENUM('hadir', 'izin', 'sakit', 'alpha') NOT NULL DEFAULT 'alpha',
    `note` TEXT DEFAULT NULL,
    `evidence_image` VARCHAR(255) DEFAULT NULL,
    `submitted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_session` (`user_id`, `session_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- 4. Tabel Informasi Akademik Mata Kuliah Statistika
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_info` (
    `id` INT PRIMARY KEY DEFAULT 1,
    `lecturer_name` VARCHAR(150) DEFAULT 'Dosen Pengampu Statistika',
    `lecturer_nip` VARCHAR(50) DEFAULT '-',
    `schedule_day` VARCHAR(50) DEFAULT 'Rabu',
    `schedule_time` VARCHAR(100) DEFAULT '13:00 - 15:30 WIB',
    `room` VARCHAR(100) DEFAULT 'G. Mahdor R. C 306',
    `whatsapp_group_link` VARCHAR(255) DEFAULT 'https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain',
    `pj_whatsapp_phone` VARCHAR(50) DEFAULT '082316188656',
    `lecturer_phone` VARCHAR(50) DEFAULT '',
    `lecturer_email` VARCHAR(100) DEFAULT '',
    `auto_session_enabled` TINYINT(1) DEFAULT 1,
    `auto_open_time` VARCHAR(20) DEFAULT '13:00',
    `auto_close_time` VARCHAR(20) DEFAULT '15:30',
    `skip_next_session` TINYINT(1) DEFAULT 0,
    `tolerance_minutes` INT DEFAULT 30,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `course_info` (`id`, `lecturer_name`, `lecturer_nip`, `schedule_day`, `schedule_time`, `room`, `whatsapp_group_link`, `pj_whatsapp_phone`, `auto_session_enabled`, `skip_next_session`) VALUES
(1, 'RIFQI HIDAYAT', '0401088701', 'Kamis', '13:00 - 15:30 WIB', 'G. Mahdor R. C 306', 'https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain', '082316188656', 1, 0);

-- -------------------------------------------------------------
-- 5. Tabel Bank Materi Perkuliahan
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `materials` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `meeting_number` INT DEFAULT 1,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `file_name` VARCHAR(255) DEFAULT NULL,
    `file_path` VARCHAR(255) DEFAULT NULL,
    `file_type` VARCHAR(100) DEFAULT NULL,
    `file_size` INT DEFAULT NULL,
    `external_link` VARCHAR(255) DEFAULT NULL,
    `category` VARCHAR(50) DEFAULT 'slide',
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- 6. Tabel Tugas & Pengumpulan Berkas Mahasiswa
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `due_date` DATE NOT NULL,
    `due_time` VARCHAR(10) DEFAULT '23:59',
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `assignment_id` INT DEFAULT NULL,
    `task_title` VARCHAR(255) DEFAULT NULL,
    `description` TEXT,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) DEFAULT NULL,
    `file_type` VARCHAR(100) NOT NULL,
    `file_size` INT NOT NULL,
    `submitted_date` DATE NOT NULL,
    `submitted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- 7. Tabel Kalender Akademik, Pengumuman, dan Laporan & Saran
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `event_date` DATE NOT NULL,
    `event_time` VARCHAR(20) DEFAULT NULL,
    `event_type` ENUM('kuliah', 'tugas', 'ujian', 'lainnya') NOT NULL DEFAULT 'kuliah',
    `location` VARCHAR(255) DEFAULT NULL,
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `announcements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `created_by` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `category` ENUM('kritik', 'saran', 'bug') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('baru', 'diproses', 'selesai') NOT NULL DEFAULT 'baru',
    `admin_response` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `theme` VARCHAR(50) NOT NULL DEFAULT 'biru-klasik',
    `dark_mode` TINYINT(1) NOT NULL DEFAULT 0,
    `auto_logout_minutes` INT NOT NULL DEFAULT 30,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('info', 'warning', 'reminder', 'announcement') NOT NULL DEFAULT 'info',
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
