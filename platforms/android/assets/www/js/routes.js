angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
      
        
    .state('tabsController.home', {
      url: '/page2',
      views: {
        'tab1': {
          templateUrl: 'templates/home.html',
          controller: 'homeCtrl'
        }
      }
    })
        
      
    
      
        
    .state('tabsController.upgrades', {
      url: '/page3',
      views: {
        'tab2': {
          templateUrl: 'templates/upgrades.html',
          controller: 'upgradesCtrl'
        }
      }
    })
        
      
    
      
        
    .state('tabsController.employees', {
      url: '/page4',
      views: {
        'tab3': {
          templateUrl: 'templates/employees.html',
          controller: 'employeesCtrl'
        }
      }
    })
        
      
    
      
    .state('tabsController', {
      url: '/page1',
      abstract:true,
      templateUrl: 'templates/tabsController.html'
    })
      
    ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/page1/page2');

});