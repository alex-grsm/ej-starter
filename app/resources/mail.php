<?php 

require_once('phpmailer/PHPMailerAutoload.php');
$mail = new PHPMailer;
$mail->CharSet = 'utf-8';

$name = $_POST['user_name'];
$phone = $_POST['user_phone'];
$email = $_POST['user_email'];

//$mail->SMTPDebug = 3;                               // Enable verbose debug output

$mail->isSMTP();                                      // Set mailer to use SMTP
$mail->Host = 'SMTP_server';  						// Specify main and backup SMTP servers
$mail->SMTPAuth = true;                               // Enable SMTP authentication
$mail->Username = 'name@mail.ru'; // Ваш логин от почты с которой будут отправляться письма
$mail->Password = 'password'; // Ваш пароль от почты с которой будут отправляться письма
$mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
$mail->Port = 465; // TCP port to connect to / этот порт может отличаться у других провайдеров

$mail->setFrom('name@mail.ru'); // от кого будет уходить письмо?
$mail->addAddress('name@mail.ru');     // Кому будет уходить письмо 
//$mail->addAddress('ellen@example.com');               // Name is optional
//$mail->addReplyTo('info@example.com', 'Information');
//$mail->addCC('cc@example.com');
//$mail->addBCC('bcc@example.com');
//$mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
//$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name
$mail->isHTML(true);                                  // Set email format to HTML

$mail->Subject = 'Супер_сайт';
// $mail->Body    = '' .$name . ' оставил заявку, его телефон ' .$phone. '<br>Почта этого пользователя: ' .$email;
// $mail->AltBody = '';

$mail->Body = '<html><body>';
$mail->Body .= '<table rules="all" style="border-color: #666;" cellpadding="10">';
$mail->Body .= "<tr style='background: #eee;'><td><strong>Ім'я:</strong> </td><td>" . strip_tags($_POST['user_name']) . "</td></tr>";
$mail->Body .= "<tr style='background: #eee;'><td><strong>Телефон:</strong> </td><td>" . strip_tags($_POST['user_phone']) . "</td></tr>";
$mail->Body .= "<tr style='background: #eee;'><td><strong>Email:</strong> </td><td>" . strip_tags($_POST['user_email']) . "</td></tr>";
$mail->Body .= "</table>";
$mail->Body .= "</body></html>";


if(!$mail->send()) {
    echo 'Error';
} else {
    header('location: thanks.html');
}
?>