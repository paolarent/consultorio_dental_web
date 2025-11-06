import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Footer } from "../../components/footer/footer";
import { LandingPage } from '../../components/landing-page/landing-page';

@Component({
  selector: 'app-home',
  imports: [Footer, Navbar, LandingPage],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
