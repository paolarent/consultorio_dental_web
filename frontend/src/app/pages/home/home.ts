import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Footer } from "../../components/footer/footer";
import { LandingPage } from '../../components/landing-page/landing-page';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Footer, Navbar, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
