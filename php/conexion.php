<?php
$host='localhost';
$usuario='root';
$contraseña='';
$basedatos='que_cocino_hoy';

$conexion=new mysqli($host,$usuario,$contraseña,$basedatos);
if ($conexion->connect_error){
    die("conexion fallida: " . $conexion->connect_error);
}
$conexion->set_charset('utf8mb4');
?>