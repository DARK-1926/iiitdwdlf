import Layout from "@/components/Layout";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, MessageSquare, MapPin, Shield, ArrowRight } from 'lucide-react';

const HowItWorksPage = () => {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-white" />,
      title: "Report an Item",
      description: "Whether you've lost or found something, start by creating a detailed report with photos and location information.",
      color: "bg-lost-purple"
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Community Search",
      description: "Our community of users will be on the lookout, connecting lost items with their owners through our searchable database.",
      color: "bg-lost-purple-dark"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-white" />,
      title: "Secure Communication",
      description: "When a potential match is found, our secure messaging system helps you communicate and verify ownership.",
      color: "bg-lost-purple"
    },
    {
      icon: <MapPin className="h-8 w-8 text-white" />,
      title: "Meet & Verify",
      description: "Arrange a safe meeting in a public place to verify and retrieve the lost item.",
      color: "bg-lost-purple-dark"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16 animate-fadein">
          <h1 className="text-4xl font-bold mb-4 font-heading animate-fadein">How FoundBuddy Works</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-body animate-fadein">
            Our platform connects people who have lost items with those who've found them, creating a community built on trust and goodwill.
          </p>
        </div>
        
        {/* Step-by-step process */}
        <div className="mb-16 animate-fadein">
          <div className="relative">
            <div className="absolute left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 top-24 md:top-20 hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative animate-fadein">
                  <div className="flex flex-col items-center">
                    <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg z-10 animate-pulse-gentle`}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 font-heading animate-fadein">{step.title}</h3>
                    <p className="text-center text-gray-600 dark:text-gray-400 font-body animate-fadein">
                      {step.description}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-4 top-20 text-gray-300 dark:text-gray-700 animate-fadein" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Tips section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Best Practices</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">For Lost Item Reports</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">1</div>
                    <span>Be specific about where you last had the item</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">2</div>
                    <span>Include unique identifying characteristics that only the owner would know</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">3</div>
                    <span>Upload clear photos if you have any</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">4</div>
                    <span>Regularly check the platform for updates and messages</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">For Found Item Reports</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">1</div>
                    <span>Provide general details but keep some specific features private for verification</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">2</div>
                    <span>Take clear photos that don't reveal sensitive information</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">3</div>
                    <span>Suggest a public place for the exchange when a match is found</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-lost-purple-light text-lost-purple rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">4</div>
                    <span>Always verify ownership before returning an item</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Trust & Safety */}
        <div className="bg-gray-50 dark:bg-card rounded-xl p-8 mb-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/4 mb-6 md:mb-0 flex justify-center">
              <div className="bg-white dark:bg-background rounded-full p-6 shadow-lg">
                <Shield className="h-16 w-16 text-lost-purple" />
              </div>
            </div>
            <div className="md:w-3/4 md:pl-8">
              <h2 className="text-2xl font-bold mb-4">Trust & Safety</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                At FoundBuddy, your safety is our priority. We've implemented several measures to ensure safe interactions:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="text-lost-purple mr-2">•</div>
                  <span>Verified user profiles with community ratings</span>
                </li>
                <li className="flex items-start">
                  <div className="text-lost-purple mr-2">•</div>
                  <span>Secure messaging that doesn't share personal contact information</span>
                </li>
                <li className="flex items-start">
                  <div className="text-lost-purple mr-2">•</div>
                  <span>Recommended safe meeting places for item exchanges</span>
                </li>
                <li className="flex items-start">
                  <div className="text-lost-purple mr-2">•</div>
                  <span>Active moderation to prevent misuse of the platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Join our community and help reunite people with their lost belongings.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/report">Report an Item</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/items/lost">Browse Lost Items</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
